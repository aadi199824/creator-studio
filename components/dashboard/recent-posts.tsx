import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const posts = [
  {
    title: "Hanuman Episode 31",
    brand: "Hanuman",
    status: "Published",
  },
  {
    title: "Corporate Slaves Party",
    brand: "CSP",
    status: "Scheduled",
  },
  {
    title: "Instagram Tips",
    brand: "Creator",
    status: "Draft",
  },
];

export default function RecentPosts() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {posts.map((post) => (
          <TableRow key={post.title}>
            <TableCell>{post.title}</TableCell>
            <TableCell>{post.brand}</TableCell>
            <TableCell>{post.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}